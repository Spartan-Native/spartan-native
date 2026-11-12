# Security policy

## Supported versions

Only the latest release of the `@spartan-native/*` packages gets security fixes. All packages share one version number.

## Reporting a vulnerability

Please do not open a public issue. Report it privately through GitHub instead: on this repository, open **Security → Report a vulnerability** ([direct link](https://github.com/Spartan-Native/spartan-native/security/advisories/new)).

You will get an answer within a week. Once a fix is released, the advisory is published with credit to you, unless you ask not to be named.

## Scope

Everything in this repository that ships to npm: `@spartan-native/theme`, `helm`, `desktop-ui`, `host-web` and `host-conformance`. Reports about the host adapters are especially welcome, since they read OS settings and open file dialogs on the app's behalf.

The adapters that live in their own repositories (`host-wails`, `host-tauri`, `host-dotnet`) take reports there. The stock spartan/ui components in `libs/spartan-ui` come from [spartan/ui](https://github.com/spartan-ng/spartan); report problems in those upstream.
