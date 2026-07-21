# Pulumi Registry — Feasibility Assessment

Research + prep spike for the "Submit to the Pulumi Registry" item of the
**SEO & Discoverability** initiative. Bottom line: a public Registry listing is a
**breaking, library-wide refactor**, not an additive packaging step. It should be
tracked as its own epic (a likely `v2`), not folded into the SEO sprint.

_Assessed 2026-06-08 against `@pulumi/pulumi` 3.175.0 and Pulumi CLI v3.244.0._

## Where the library sits today

`infra-foundry` is a **native language package** in Pulumi's taxonomy: TypeScript
`ComponentResource` classes published to npm, consumable only from TS/JS. Native
language packages are **not listed in the Pulumi Registry at all** — they are
ordinary npm libraries. Getting into the Registry means adopting the
**plugin-package** distribution model (a schema + a component host), which is a
change of model, not metadata.

## The two registry paths

|                        | `pulumi package publish` (Private Registry)                                                                                           | Public Registry (`pulumi.com/registry`)                                                                                                                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Serves public SEO?** | ❌ No — org-private only                                                                                                              | ✅ Yes — the discoverability target                                                                                                                                                                                                                                                            |
| **Effort**             | Low                                                                                                                                   | High                                                                                                                                                                                                                                                                                           |
| **Needs**              | `PulumiPlugin.yaml` + component host, a README, a `vX.Y.Z` git tag, then `pulumi package publish github.com/0xhssn/infra-foundry@1.x` | `schema.json` + metadata, multi-language SDKs published to npm + PyPI + NuGet + Maven, plugin binary on GitHub Releases, `docs/_index.md` + `docs/installation-configuration.md`, repo conventionally `pulumi-*`, then a PR to the `pulumi/registry` community list → CI publishes the listing |

**The catch:** the low-effort `pulumi package publish` command targets the
**Private Registry only** (confirmed in the CLI docs). It does nothing for public
discoverability, which is the entire point of this task. The only path that serves
the goal is the heavy public-registry submission.

### Two caveats worth resolving before any investment

1. **Eligibility is unconfirmed.** The public Registry was built around
   _providers_. The auto-generated component API-docs feature was announced for the
   **Private** Registry, and `pulumi package publish` only targets private. I could
   not confirm that a pure component package gets a first-class **public**
   `pulumi.com/registry` listing today. Worth asking Pulumi directly before
   committing days of work.
2. **The modern bar is lower but not small.** "Source-based plugin packages" mean
   you don't hand-write `schema.json` or build a Go provider — a `PulumiPlugin.yaml`
   plus a Node component host lets Pulumi introspect the TS classes and generate the
   schema. But the spike below shows our components don't satisfy the introspection
   contract.

## Prep spike — does the schema introspect?

**Method.** Drove the experimental component-schema analyzer
(`@pulumi/pulumi/provider/experimental/analyzer`) directly against each component's
TypeScript source, one component at a time, to isolate per-component results.
(Throwaway scaffolding; see "Reproduce" below.)

**Result: 0 of 20 component classes introspect cleanly.**

| Failure                               | Classes                                 | Analyzer error                                                                 |
| ------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------ |
| Constructor has no param named `args` | 17 — every component except the 3 below | `constructor must have an 'args' parameter`                                    |
| Unsupported output type               | `Ses`                                   | `Unsupported type for component output 'verificationRecord': type 'DnsRecord'` |
| Import resolution                     | `SesWithRoute53`                        | analyzer could not follow a transitive `./service` import                      |
| Wrong base class                      | `DockerImage`                           | not detected as a component (extends `docker.Image`, not `ComponentResource`)  |

**The contract.** The analyzer requires the constructor to take a parameter
**literally named `args`** whose type is a named **interface**
(`param.name.escapedText === "args"`), and public output properties must be
primitives, arrays, or resolvable **resource references** — not plain custom
interfaces. `Ses` is the only class that passes the constructor gate (it uses
`args: SesComponentArgs`); it then fails because it exposes a plain `DnsRecord`
output.

## What remediation would take

Grouped by cost. The convention Pulumi wants is `constructor(name, args: SomeArgs, opts?)`.

**A. Param rename — non-breaking** (param is positional, so callers are unaffected).
Rename the second param `config` → `args`:
`CloudflareNameserver`, `HostedZone`, `VercelProject`, `IdentityCenterAdmin`,
`PermissionSet`, `IdentityCenterTeamMembers`, `OrganizationalUnits`.

**B. Signature change — breaking** (these take the args object _first_ and
destructure `name` out of it; the Pulumi convention separates the resource name
from args, shifting positions):
`AmplifyApp`, `AppRunnerService`, `EcrRepository`, `RdsInstance`, `S3Bucket`,
`Secret`, `SqsQueue`. Callers move from `new S3Bucket({ name, ... })` to
`new S3Bucket('name', { ... })`.

**C. Add an args interface** (currently take no args object):
`EcsCluster`, `Vpc`.

**D. Structural rework:**

- `EcsService` — four positional params including another component instance
  (`cluster`) and a separate `vpcConfig`; must be consolidated into one `args`
  interface with the cross-component reference as an input.
- `DockerImage` — extends `docker.Image`, not `ComponentResource`; must be
  re-wrapped to be introspectable.

**E. Output surfaces (orthogonal, hits already-conforming code):** plain custom
interfaces exposed as outputs (`DnsRecord` in `Ses`, `CloudflareNameserver`,
`HostedZone`) are unsupported and must become primitives or real resource refs.

Buckets B, C, and D are **breaking public-API changes**, and E changes public output
shapes — so full Registry-introspectability is effectively a **v2** of the library.

## Recommendation

1. **Descope from the SEO sprint.** Topics, keywords, and the README restructure are
   shipped and serve discoverability now (npm already drives ~557 downloads/mo). The
   Registry is additive and far heavier.
2. **Resolve eligibility first.** Ask Pulumi (GitHub Discussion / Slack) whether a
   pure component package can get a **public** Registry listing before investing.
3. **If yes, scope a `v2`** that standardizes every constructor on
   `(name, args, opts)` and primitive/resource outputs. Bucket A (rename) can land
   early and non-breaking; B–E ride a major version.

## Reproduce

```js
// Drive the analyzer per-component against src/.
const { Analyzer } = require('@pulumi/pulumi/provider/experimental/analyzer')
const pkg = { name: 'infra-foundry', main: 'src/<entry>.ts' } // entry re-exporting the class
const a = new Analyzer(process.cwd(), 'infra-foundry', pkg, new Set(['S3Bucket']))
console.log(JSON.stringify(a.analyze(), null, 2)) // throws with the contract violation
```

The entry file must re-export each component class via `import`/`export` (not
`export *`) so the analyzer can walk the import graph from one entry point.

## Sources

- [Publishing to the Pulumi Registry](https://www.pulumi.com/docs/iac/guides/building-extending/packages/publishing-packages/)
- [`pulumi package publish` CLI](https://www.pulumi.com/docs/iac/cli/commands/pulumi_package_publish/)
- [Cross-language Components](https://www.pulumi.com/docs/iac/concepts/components/cross-language-components/)
- [Next-generation Pulumi Components (blog)](https://www.pulumi.com/blog/pulumi-components/)
- [Component API docs in Private Registry (blog)](https://www.pulumi.com/blog/registry-component-api-docs/)
