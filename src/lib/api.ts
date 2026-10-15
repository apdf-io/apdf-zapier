import type { HttpMethod, HttpResponse, ZObject } from 'zapier-platform-core';

import { ensureSuccessful } from './errors.js';

/**
 * Where the Apdf API lives. Overridable through the environment so the integration can be
 * pointed at a local or staging instance while developing; production never sets it.
 */
export const API_BASE_URL = (process.env.APDF_BASE_URL ?? 'https://apdf.io/api').replace(/\/+$/, '');

/** The largest page the Apdf API serves. */
export const MAX_PAGE_SIZE = 100;

/** The shape every Apdf resource response is wrapped in. */
export interface Envelope<T> {
  data: T;
}

/** A page of a paginated Apdf list. */
export interface Page<T> extends Envelope<T[]> {
  links: { next: string | null };
}

interface RequestOptions {
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
  skipThrowForStatus?: boolean;
}

/**
 * Whether a value carries nothing to send: null, undefined, an empty string, list or object.
 */
const isEmpty = (value: unknown): boolean =>
  value === null ||
  value === undefined ||
  value === '' ||
  (Array.isArray(value) && value.length === 0) ||
  (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0);

/**
 * Drop empty values from a request payload, at every depth. The app turns off Zapier's own
 * cleaning of input data, so optional fields left blank are removed here instead, after any
 * reshaping that depends on list positions.
 */
export const withoutEmptyValues = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(withoutEmptyValues).filter((item) => !isEmpty(item));
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, withoutEmptyValues(item)])
        .filter(([, item]) => !isEmpty(item)),
    );
  }

  return value;
};

/**
 * Turn an API path into a full URL.
 */
export const apiUrl = (path: string): string => `${API_BASE_URL}${path}`;

/**
 * Whether a URL belongs to the Apdf API, so authentication and error handling never leak onto
 * other hosts such as the storage the result files are downloaded from.
 */
export const isApiUrl = (url: string | undefined): boolean => url !== undefined && url.startsWith(API_BASE_URL);

/**
 * Send a request to the Apdf API and hand back the raw response.
 */
export const request = (
  z: ZObject,
  method: HttpMethod,
  path: string,
  { params, body, skipThrowForStatus }: RequestOptions = {},
): Promise<HttpResponse> =>
  z.request({
    method,
    url: apiUrl(path),
    ...(params ? { params: withoutEmptyValues(params) as Record<string, unknown> } : {}),
    ...(body ? { body: withoutEmptyValues(body) as Record<string, unknown> } : {}),
    ...(skipThrowForStatus ? { skipThrowForStatus } : {}),
  });

/**
 * Send a request and return the parsed JSON body as it arrived.
 */
export const send = async <T>(z: ZObject, method: HttpMethod, path: string, options: RequestOptions = {}): Promise<T> =>
  (await request(z, method, path, options)).data as T;

/**
 * Send a request and return the resource without its "data" envelope.
 */
export const fetchData = async <T>(
  z: ZObject,
  method: HttpMethod,
  path: string,
  options: RequestOptions = {},
): Promise<T> => (await send<Envelope<T>>(z, method, path, options)).data;

/**
 * Like fetchData, but a missing record yields null instead of an error. Searches and
 * unsubscribes treat "not found" as an answer, not a failure.
 */
export const fetchDataOrNull = async <T>(
  z: ZObject,
  method: HttpMethod,
  path: string,
  options: RequestOptions = {},
): Promise<T | null> => {
  const response = await request(z, method, path, { ...options, skipThrowForStatus: true });

  if (response.status === 404) {
    return null;
  }

  ensureSuccessful(z, response);

  return (response.data as Envelope<T> | undefined)?.data ?? null;
};

/**
 * Fetch one page of a paginated list. Pages are counted from 1, as the API counts them.
 */
export const fetchPage = <T>(
  z: ZObject,
  path: string,
  page: number,
  params: Record<string, unknown> = {},
): Promise<Page<T>> => send<Page<T>>(z, 'GET', path, { params: { ...params, page, per_page: MAX_PAGE_SIZE } });

/**
 * Walk a paginated list page by page until the predicate matches or the list ends. It sets
 * "page" itself rather than following links.next, which Laravel builds without the other
 * query parameters.
 */
export const findInList = async <T>(z: ZObject, path: string, predicate: (item: T) => boolean): Promise<T | null> => {
  for (let page = 1; ; page++) {
    const { data, links } = await fetchPage<T>(z, path, page);
    const match = data.find(predicate);

    if (match !== undefined) {
      return match;
    }

    if (links.next === null) {
      return null;
    }
  }
};
