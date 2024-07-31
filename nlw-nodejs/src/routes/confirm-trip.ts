import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import nodemailer from "nodemailer";
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";
import { getMailClient } from "../lib/mail";

export async function confirmTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/trips/:tripId/confirm",
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
        }),
      },
    },
    async (req, reply) => {
      const { tripId } = req.params;

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
        include: {
          participants: {
            where: {
              is_owner: false,
            },
          },
        },
      });

      if (!trip) {
        throw new Error("Trip not found");
      }

      if (trip.is_confirmed) {
        reply.redirect(`http://localhost:5173/trips/${tripId}`);
      }

      await prisma.trip.update({
        where: {
          id: tripId,
        },
        data: {
          is_confirmed: true,
        },
      });

      const formattedStartDate = dayjs(trip.starts_at).format("LL");
      const formattedEndDate = dayjs(trip.ends_at).format("LL");

      const confirmationLink = `http://localhost:3333/trips/${tripId}/confirm`;

      const mail = await getMailClient();

      await Promise.all(
        trip.participants.map(async (participant) => {
          const message = await mail.sendMail({
            from: {
              name: "Equipe plann.er",
              address: "hi@plann.er",
            },
            to: participant.email,
            subject: `Confirme sua presença na viagem para ${trip.destination}}.`,
            html: `
            <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6">
              <p>
                Você solicitou a criação de uma viagem para
                <strong>${trip.destination}</strong> nas datas de
                <strong>${formattedStartDate}</strong> até <strong>${formattedEndDate}</strong>
              </p>
              <p></p>
              <p>
                Para <strong>confirmar</strong> sua viagem,
                <strong>click no link abaixo</strong>:
              </p>
              <p></p>
              <p>
                <a href="${confirmationLink}"><strong>Confirmar viagem</strong></a>
              </p>
              <p></p>
              <p>
                Caso você não saiba do que se trata esse e-mail, apenas ignore esse e-mail.
              </p>
            </div>
            `.trim(),
          });

          console.log(nodemailer.getTestMessageUrl(message));
        })
      );

      return { tripId: req.params.tripId };
    }
  );
}
