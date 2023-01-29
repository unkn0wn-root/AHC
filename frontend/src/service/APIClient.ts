import { IConfession } from '../pages/Confessions'
import { IReply } from '../pages/Replies'
import { HTTPClient } from './HTTPClient'

abstract class BaseService {
  abstract path: string

  protected _httpClient: HTTPClient

  constructor(client: HTTPClient) {
    this._httpClient = client
  }
}

export interface AcceptConfessionOptions {
  includeEmbed?: boolean
  includeSurvey?: boolean
  isPlus18?: boolean
}

class ConfessionApi extends BaseService {
  public readonly path = '/confessions'

  public add(confession: IConfession, options: AcceptConfessionOptions = { includeEmbed: true, includeSurvey: true }) {
    return this._httpClient.post(`/confessions/confession/${confession._id}/accept`, options)
  }

  public setStatus(confession: IConfession, { status, note }: {status: number, note?: string}) {
    return this._httpClient.put(`/confessions/confession/${confession._id}/status`, { status, note })
  }

  public delete(confession: IConfession) {
    return this._httpClient.delete(`/confessions/confession/${confession._id}`)
  }

  public setTag(confession: IConfession, { tag, tagValue }: {tag: string, tagValue: boolean}) {
    return this._httpClient.put(`/confessions/confession/${confession._id}/tags`, { tag, tagValue })
  }

  public getIp(confession: IConfession) {
    return this._httpClient.get(`/confessions/confession/${confession._id}/ip`)
  }

  public getFromIp(confession: IConfession) {
    return this._httpClient.get(`/confessions/confession/${confession._id}/otherFromIp`)
  }
}

class ReplyApi extends BaseService {
  path = '/replies'

  add(reply: IReply) {
    return this._httpClient.get(`/replies/reply/${reply._id}/accept`)
  }

  setStatus(reply: IReply, { status }:{ status: number}) {
    return this._httpClient.put(`/replies/reply/${reply._id}/status`, { status })
  }

  delete(reply: IReply) {
    return this._httpClient.delete(`/replies/reply/${reply._id}`)
  }
}

export default function createAPIClient(client: HTTPClient) {
  return {
    confessions: new ConfessionApi(client),
    replies: new ReplyApi(client),
  }
}
