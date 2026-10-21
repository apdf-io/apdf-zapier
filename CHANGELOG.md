## 1.2.0

- New action: Add Comment to Annotation, which adds a comment to an annotation for readers to see in the document: the opening comment if it has none yet, otherwise a reply in its thread. It doesn't start reader event triggers.
- Annotation triggers now include the annotation ID, so a later step can comment on it. Annotation Created and Annotation Updated also include the replies to the annotation's comment and which fields changed, and Annotation Updated now also triggers when a reader replies.

## 1.1.0

- New action: Get PDF Form Fields, which reads the form fields of a PDF with their names, types, values, options and labels.
- New action: Fill PDF Form, which fills the form fields of a PDF by name and creates the filled PDF.
- New action: Visualize PDF Form, which renders the form pages of a PDF as images with a numbered box on every field, so an AI step can see which field is which.
