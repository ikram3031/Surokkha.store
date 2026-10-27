export interface Testimonial {
  quote: string
  /** e.g. "Verified customer" or a first name */
  author: string
  /** e.g. "Dhaka" or "Name hidden for privacy" */
  note?: string
}

// Add real customer reviews here (only ones you have permission to show). While this list is empty
// the testimonial section on the home page stays hidden, so no review is ever invented.
export const testimonials: Testimonial[] = []
