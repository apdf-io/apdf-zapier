/** Who an API token acts as: its user and the workspace it belongs to. */
export type Account = {
  user: { email: string; name: string | null };
  workspace: {
    id: string;
    handle: string | null;
    name: string | null;
    plan: { name: string; tracked_documents: number | null; trial_ends_at: string | null };
  };
};

/** A tracked document, as the Apdf API returns it. */
export type Document = {
  doc_id: string;
  viewer_url: string;
  file_url: string;
  name: string;
  file_size: number;
  file_pages: number;
  is_public: boolean;
  created_at: string;
  archived_at: string | null;
};

/** A per-recipient tracking link. */
export type TrackingLink = {
  token: string;
  name: string;
  email: string | null;
  url: string;
  is_active: boolean;
  last_viewed_at: string | null;
  created_at: string;
};

/** An automation, of which the triggers only need the ID. */
export type Automation = {
  id: string;
};

/** The payload an Apdf automation posts to its webhook when a reader does something. */
export type ReaderEventPayload = {
  automation: { id: string; name: string };
  document: { doc_id: string; name: string; viewer_url: string; file_pages: number };
  trigger: { matched_event: string; conditions_evaluated: boolean };
  event: {
    session_id: string;
    viewer_id: string;
    recipient: { name: string; email: string | null } | null;
    data: Record<string, unknown> | null;
  };
  session: { total_duration_ms: number; pages_viewed: number; completion_rate: number };
  timestamp: string;
};

/** One logged automation run, which carries the payload that was sent. */
export type AutomationExecution = {
  matched_event: string | null;
  doc_id: string | null;
  payload: ReaderEventPayload | null;
};

/** The state of an asynchronous PDF operation, polled or posted to its webhook. */
export type ApiJob = {
  id: string;
  created: string;
  status: 'pending' | 'running' | 'successful' | 'failed';
  result: unknown;
};

/** One visit of a reader to a document. */
export type ReadingSession = {
  session_id: string;
  recipient: { name: string; email: string | null } | null;
  created_at: string;
};
