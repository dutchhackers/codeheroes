import { Response } from 'express';
import { HTTP_STATUS } from '../constants/http.constants';

export class ResponseHandler {
  static success(res: Response, message: string) {
    return res.status(HTTP_STATUS.OK).send(message);
  }

  static badRequest(res: Response, message: string) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send(message);
  }

  static error(res: Response, message: string) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(message);
  }
}
