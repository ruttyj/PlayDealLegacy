import { Model } from '@geckos.io/typed-array-buffer-schema'

import roomSchema from '../Schemas/Room'
import personSchema from '../Schemas/Person'
import chatMessageSchema from '../Schemas/ChatMessage'

export const roomModel = new Model(roomSchema)
export const personModel = new Model(personSchema)
export const chatMessageModel = new Model(chatMessageSchema)