import { getEmailValidationError, normalizeEmail } from "../utils/email";
import type { ContactMailInput } from "../services/mailService";

type ContactRequestBody = {
  nome?: unknown;
  email?: unknown;
  assunto?: unknown;
  mensagem?: unknown;
  website?: unknown;
};

type ContactValidationResult =
  | {
      ok: true;
      data: ContactMailInput;
      isSpam: boolean;
    }
  | {
      ok: false;
      message: string;
    };

const MAX_NAME_LENGTH = 100;
const MAX_SUBJECT_LENGTH = 140;
const MAX_MESSAGE_LENGTH = 2000;

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function removeControlCharacters(value: string) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

export class ContactValidator {
  static normalize(body: ContactRequestBody = {}): ContactValidationResult {
    const name = removeControlCharacters(readString(body.nome));
    const email = normalizeEmail(readString(body.email));
    const subject = removeControlCharacters(readString(body.assunto));
    const message = removeControlCharacters(readString(body.mensagem));
    const website = readString(body.website);

    if (website) {
      return {
        ok: true,
        isSpam: true,
        data: {
          name: "spam",
          email: "spam@example.com",
          subject: "spam",
          message: "spam"
        }
      };
    }

    if (!name) return { ok: false, message: "Informe seu nome" };
    if (name.length > MAX_NAME_LENGTH) {
      return { ok: false, message: `Nome deve ter no maximo ${MAX_NAME_LENGTH} caracteres` };
    }

    const emailError = getEmailValidationError(email);
    if (emailError) return { ok: false, message: emailError };

    if (!subject) return { ok: false, message: "Informe o assunto" };
    if (subject.length > MAX_SUBJECT_LENGTH) {
      return { ok: false, message: `Assunto deve ter no maximo ${MAX_SUBJECT_LENGTH} caracteres` };
    }

    if (!message) return { ok: false, message: "Informe a mensagem" };
    if (message.length > MAX_MESSAGE_LENGTH) {
      return { ok: false, message: `Mensagem deve ter no maximo ${MAX_MESSAGE_LENGTH} caracteres` };
    }

    return {
      ok: true,
      isSpam: false,
      data: {
        name,
        email,
        subject,
        message
      }
    };
  }
}
