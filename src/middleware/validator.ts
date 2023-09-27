import { RequestHandler } from "express";
import * as yup from "yup";

export const validate = (schema: any): RequestHandler => {
  return async (req, res, next) => {
    if (!req.body) {
      return res.status(422).json({ error: "Empty body is not excepted" });
    }
    const schemaToValidate = yup.object({
      body: schema,
    });
    req.body;
    try {
      await schemaToValidate.validate(
        {
          body: req.body,
        },
        {
          abortEarly: true, //means we dont have to wait for the entire validation if errors are present then show the error firstly
        }
      );
      next();
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        res.status(422).json({ error: error.message });
      }
    }
  };
};
