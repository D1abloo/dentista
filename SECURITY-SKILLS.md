# Security Skills

Use these installed security skills when the user asks for secure development, security review, cloud/IaC checks, incident response, vulnerability triage, compliance, identity, network, SecOps, or AI/LLM security work.

## Always Read First

Before any security-related task, the agent must read this file and route the request to the smallest useful security skill or role bundle.

If this file is missing in a project folder, run:

```bash
security-skills-project-rules "$PWD"
```

## General Launcher

`/security-skills` is the general launcher for the whole security skill pack.

It should:

- Ensure this `SECURITY-SKILLS.md` file exists in the current project.
- Read this file before executing.
- Decide which specific security skill or role bundle is needed.
- Use one focused skill for small tasks.
- Use a role bundle for broad reviews.

Examples:

```text
/security-skills revisa este proyecto completo
```

```text
/security-skills revisa mis endpoints
```

```text
/security-skills busca secretos expuestos y riesgos de CI/CD
```

## Default Remediation Instruction

When selected text, pasted findings, scanner output, or a security request includes vulnerabilities, use this instruction automatically:

```text
corrige las vulnerabilidades que sean seguras de corregir automáticamente; para cambios riesgosos, explícame opciones antes de tocar.
```

Safe automatic fixes are clear changes that preserve public APIs, data shape, behavior, and deployment assumptions. Risky fixes require options first, especially changes to authentication, authorization, database schema, public API contracts, production infrastructure, key material, CI/CD release gates, or major dependency versions.

## Role Bundles

- `security-engineer`: broad secure engineering workflow.
- `appsec-engineer`: application security design, testing, code review, APIs, LLM apps.
- `cloud-security-engineer`: AWS/Azure/GCP, IaC, containers, identity.
- `soc-analyst`: alert triage, threat hunting, incident investigation, detection engineering.
- `vciso`: security program, compliance, risk, board-ready reporting.

Use role bundles when the request is broad or spans multiple security domains.

## Common Skills

- `secure-code-review`: review source code for security defects.
- `threat-modeling`: STRIDE-style threat modeling for design, API, or architecture.
- `api-security`: OWASP API Security Top 10 review.
- `owasp-top-10-web`: OWASP web application review.
- `dependency-scanning`: dependency and supply-chain review.
- `secrets-management`: secrets exposure, storage, rotation, and CI/CD handling.
- `pipeline-security`: CI/CD hardening.
- `prompt-injection`: LLM prompt injection testing.
- `llm-top-10`: OWASP LLM Top 10 review.
- `agent-security`: agentic AI security architecture.
- `aws-review`, `azure-review`, `gcp-review`: cloud security review.
- `iac-security`: Terraform/CloudFormation/Kubernetes/IaC review.
- `container-security`: Docker/Kubernetes/container review.
- `cve-triage`: prioritize CVEs with exploitability and business context.
- `soc2-gap`, `iso27001-gap`, `pci-dss-review`, `hipaa-review`, `nist-csf-assessment`: compliance gap review.

## Slash Commands

```text
/security-skills
```

General launcher for all security skills.

```text
/security-review revisa este repo y dame findings accionables
```

Use for broad code or repo security reviews.

```text
/threat-model modela amenazas STRIDE para esta API
```

Use for design, API, architecture, or feature threat modeling.

```text
/api-security revisa mis endpoints contra OWASP API Top 10
```

Use for API-specific reviews.

```text
/llm-security prueba mi app contra prompt injection y OWASP LLM Top 10
```

Use for LLM, AI agent, prompt injection, and model/data-flow security.

```text
/cloud-security revisa Terraform y configuración AWS
```

Use for AWS/Azure/GCP, IaC, container, and identity security.

```text
/cve-triage CVE-2026-12345 en nuestra app
```

Use for vulnerability prioritization.

## Direct Skill Calls

You can also call a specific skill directly:

```text
Use secure-code-review. Revisa este proyecto.
```

```text
Use appsec-engineer. Haz una revisión AppSec completa.
```

```text
Use secrets-management. Busca secretos expuestos y malas prácticas.
```
