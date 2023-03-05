import { HejtoQueue } from './hejto_queue'

export const HejtoRequestQueue = new HejtoQueue(5000, 3)
HejtoRequestQueue.startProcessing()
