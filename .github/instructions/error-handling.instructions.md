# Error Handling Instructions

## Rule: Never Expose Implementation Details in Client Errors

Error messages shown to users must never reveal:
- Service names or integrations (e.g., "Resend", "Stripe", "SendGrid")
- Environment variable names (e.g., `RESEND_API_KEY`, `WEB_APP_URL`, `DATABASE_URL`)
- Internal configuration requirements or settings
- System architecture or infrastructure details
- Technical stack information

### Why
- **Security**: Attackers can use this info to target specific vulnerabilities
- **Privacy**: Implementation details can be confidential business information
- **UX**: Users don't need to know internals; they need actionable information

### Pattern: Expose Details to Logs Only

- **Backend (Logs)**: Include all implementation details for debugging
  ```typescript
  this.log.error(`Failed to send email via Resend: ${error.message}`);
  ```

- **Frontend (UI)**: Show generic, user-friendly messages
  ```typescript
  // ❌ WRONG
  'Email is not configured on the server (Resend / WEB_APP_URL)'
  
  // ✅ CORRECT
  'Email invitations are not available right now. You can still add them manually.'
  ```

### Common Scenarios

#### Email Not Configured
- **Backend Log**: `RESEND_API_KEY not set; email invitations disabled`
- **User Message**: `Email invitations are not available right now. You can add them manually and send the invite later from their profile.`

#### Database Connection Error
- **Backend Log**: `PostgreSQL connection failed: ECONNREFUSED on DATABASE_URL`
- **User Message**: `Could not save. Please try again.`

#### API Timeout
- **Backend Log**: `Request to external service timed out (service: payment-processor)`
- **User Message**: `Request timed out. Please try again.`

### Implementation Checklist

- [ ] Errors shown in UI don't mention service names (Resend, Prisma, NestJS, etc.)
- [ ] Errors don't expose environment variables
- [ ] User messages are helpful but don't require technical knowledge
- [ ] All implementation details are captured in backend logs
- [ ] Sensitive errors (500s) don't leak details in response body
