// CLI for packaging scripts:
//   node scripts/buildTarget.mjs [--edition=<id>] [--customer=<id>]
// Prints the build target (edition, customer, installer identity) as JSON.
import { resolveBuildTarget } from '../src/platform/buildTarget.js';

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => arg.replace(/^--/, '').split('='))
);

try {
  const target = resolveBuildTarget({
    edition: args.edition,
    customer: args.customer,
  });
  process.stdout.write(`${JSON.stringify(target)}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
