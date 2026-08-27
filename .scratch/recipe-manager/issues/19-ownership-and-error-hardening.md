# 19: Ownership and error hardening

**What to build:** The recipe workflow has explicit security, validation, and error guarantees.

**Blocked by:** 18: Recipe deletion

**Status:** ready-for-agent

- [ ] Integration tests prove users cannot read, update, or delete another user's recipes.
- [ ] API validates all recipe, ingredient, and step input.
- [ ] API errors use the agreed machine-readable shape.
- [ ] Atomic failure leaves no partial recipe data.
- [ ] Sensitive data and credentials are not logged.
