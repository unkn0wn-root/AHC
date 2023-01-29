import { HejtoQueue } from './hejto_queue'


export const HejtoRequestQueue = new HejtoQueue(5000, 5)
HejtoRequestQueue.startProcessing()
