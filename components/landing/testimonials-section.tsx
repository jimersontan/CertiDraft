const testimonials: any[] = [];

export function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="relative overflow-hidden py-24 sm:py-32"
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-muted/30 via-muted/50 to-muted/30" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Testimonials
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Trusted by{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              teams worldwide
            </span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            See why thousands of organizations choose CertiDraft for their
            certificate needs.
          </p>
        </div>

        {/* Testimonial cards */}
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.length > 0 ? testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="group relative rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5"
            >
              {/* Quote icon */}
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="mb-4 text-primary/15"
              >
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>

              {/* Quote text */}
              <p className="text-sm leading-relaxed text-muted-foreground">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="mt-6 flex items-center gap-3 border-t border-border/50 pt-5">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${testimonial.color} text-xs font-bold text-white`}
                >
                  {testimonial.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-12 text-center text-muted-foreground italic">
              New success stories coming soon...
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
