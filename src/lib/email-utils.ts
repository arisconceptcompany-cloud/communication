function isAllowedEmail(email: string) {
  const domains = (process.env.ALLOWED_EMAIL_DOMAINS || "value-it.mg")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? domains.includes(domain) : false;
}

export { isAllowedEmail };