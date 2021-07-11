import { ExpressContext } from 'apollo-server-express';
import { AuthenticatedUser } from '../../apiBase/auth';
import { IMe } from '../helpers/Authorization';

export type ReqContext = ExpressContext & {
  me?: IMe
  au?: AuthenticatedUser
}