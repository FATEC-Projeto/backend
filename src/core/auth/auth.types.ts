import { RouteGenericInterface } from "fastify";

export type GetUserQuery = {
  ra?: string;
  email?: string;
  id?: string;
  name?: string;
  educationalEmail?: string;
};

export interface GetUserRoute extends RouteGenericInterface {
  Querystring: GetUserQuery;
}
