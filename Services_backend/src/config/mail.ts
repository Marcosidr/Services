export type MailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  contactTo: string;
};

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    const error = new Error(`Variavel de ambiente ${name} nao configurada`);
    Object.assign(error, { status: 500, code: "MAIL_CONFIG_MISSING" });
    throw error;
  }

  return value;
}

function parsePort(value: string | undefined) {
  if (!value) return 465;

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > 65535) {
    const error = new Error("SMTP_PORT invalido");
    Object.assign(error, { status: 500, code: "MAIL_CONFIG_INVALID" });
    throw error;
  }

  return parsed;
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;
  return ["1", "true", "yes", "sim"].includes(value.trim().toLowerCase());
}

export function getMailConfig(): MailConfig {
  const host = getRequiredEnv("SMTP_HOST");
  const port = parsePort(process.env.SMTP_PORT);
  const user = getRequiredEnv("SMTP_USER");
  const pass = getRequiredEnv("SMTP_PASS");
  const secure = parseBoolean(process.env.SMTP_SECURE, port === 465);

  return {
    host,
    port,
    secure,
    user,
    pass,
    from: process.env.MAIL_FROM?.trim() || user,
    contactTo: process.env.CONTACT_MAIL_TO?.trim() || user
  };
}
