import fastify from "fastify";
import cors from "@fastify/cors";
import { createTrip } from "./routes/create-trip";
import {
  validatorCompiler,
  serializerCompiler,
} from "fastify-type-provider-zod";
import { confirmTrip } from "./routes/confirm-trip";
import { confirmParticipant } from "./routes/confirm-participants";
import { createActivities } from "./routes/create-activity";
import { getActivities } from "./routes/get-activities";

const app = fastify();

app.register(cors, {
  // Apenas para desenvolvimento aceitando todas as origens
  origin: "*",
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(createTrip);
app.register(confirmTrip);
app.register(confirmParticipant);
app.register(createActivities);
app.register(getActivities);

app.listen({ port: 3333 }).then(() => {
  console.log("Server running.");
});
