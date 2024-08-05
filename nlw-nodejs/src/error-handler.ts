import { FastifyInstance } from "fastify";
import { ClientError } from "./error/client-error";
import { ZodError } from "zod";

type FastifyErrorHandler = FastifyInstance["errorHandler"];

export const errorHandler: FastifyErrorHandler = (err, req, res) => {
  if (err instanceof ZodError) {
    return res.status(400).send({
      message: "Invalid Input",
      err: err.flatten().fieldErrors,
    });
  }

  if (err instanceof ClientError) {
    return res.status(400).send({
      message: err.message,
    });
  }

  return res.status(500).send({ message: "Internal server error" });
};
