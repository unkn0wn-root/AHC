import { HttpStatus } from '../enums'

export type HejtoResponse<T = { [key: string]: string }> = {
  status: HttpStatus;
  data: T;
  headers: any;
}
