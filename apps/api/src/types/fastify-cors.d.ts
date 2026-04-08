declare module "@fastify/cors" {
  import type { FastifyPluginCallback } from "fastify";

  export interface FastifyCorsOptions {
    origin?:
      | boolean
      | string
      | RegExp
      | Array<boolean | string | RegExp>
      | ((
          origin: string | undefined,
          callback: (error: Error | null, origin: boolean) => void,
        ) => void);
    methods?: string | string[];
    allowedHeaders?: string | string[];
    credentials?: boolean;
  }

  const fastifyCors: FastifyPluginCallback<FastifyCorsOptions>;
  export default fastifyCors;
}
