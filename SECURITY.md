# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| main    | :white_check_mark: |

## Reporting a Vulnerability

NullCarbon handles cryptographic proofs and carbon retirement records. Security is our top priority.

**Do not report security vulnerabilities through public GitHub issues.**

Please report them via one of the following channels:

- **Email**: ogazi133@gmail.com
- **GitHub Security Advisory**: Use the "Report a vulnerability" link on the repository's Security tab

### What to include

- Type of vulnerability
- Steps to reproduce (proof of concept preferred)
- Affected component(s) — circuits, contracts, backend, frontend, indexer
- Potential impact
- Any suggested mitigation (if known)

### Response timeline

- **24 hours**: Acknowledgment of receipt
- **7 days**: Initial assessment and mitigation plan
- **30 days**: Resolution or patch (depending on severity)

You will be credited as the discoverer (unless you prefer to remain anonymous).

## Security Considerations

- **Nullifier collisions** — If two credits produce the same nullifier, the second retirement is rejected. Our circuits use Poseidon2 with credit secret + credit ID + corridor ID binding. Report any hash collision concerns immediately.
- **Merkle root manipulation** — The registry Merkle root is a public circuit input. A compromised root would allow invalid credits. Report any issues with root generation or propagation.
- **Proof forgery** — The UltraHonk proving system eliminates trusted setup, but implementation bugs could allow invalid proofs. Contact us immediately if you find a way to forge or bypass a proof.
- **Smart contract access control** — The NullifierRegistry authorizes only the RetirementVerifier contract. Any bypass of this permission model is a critical vulnerability.

## Bug Bounty

Currently, NullCarbon does not offer a formal bug bounty program. This may change after mainnet launch. In the meantime, we will publicly credit all valid vulnerability reporters (with permission).

## Disclosure Policy

We follow coordinated disclosure:
1. Reporter submits in private
2. We triage and patch
3. We release a fix and public advisory simultaneously
4. Reporter is credited (optional)
