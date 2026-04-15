# Provider Setup

## Default Modes
- PR and local smoke/core runs: `PROVIDER_MODE=simulated`
- Mail assertions: `MAIL_MODE=sink`

## Real Stripe
- Real-provider execution is reserved for `nightly-provider`.
- Required secrets:
  - `STRIPE_SECRET_KEY`
  - any publishable/webhook secrets required by the target environment
- Real-provider scenarios are still explicitly gated in code until hosted checkout orchestration and cleanup rules are finalized.

## Mail
- In `e2e-test`, backend email is captured in the sink store and exposed through `/external/test/inspect`.
- Avoid asserting whole email bodies. Assert durable links and workflow intent instead.
