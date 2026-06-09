import type { Request, Response } from "express";
import { sendContactMail } from "../services/mailService";
import { ContactValidator } from "../validators/ContactValidator";

export class ContactController {
  static async send(req: Request, res: Response) {
    const validation = ContactValidator.normalize(req.body);

    if (!validation.ok) {
      return res.status(400).json({ message: validation.message });
    }

    if (!validation.isSpam) {
      await sendContactMail(validation.data);
    }

    return res.status(202).json({
      message: "Mensagem recebida com sucesso"
    });
  }
}
