import { BufferSchema } from '@geckos.io/typed-array-buffer-schema'
import { uint8, string8 } from '@geckos.io/typed-array-buffer-schema'

const personSchema = BufferSchema.schema('person', {
    id: uint8,
    name: { type: string8, length: 50 },
    isHost: uint8,
})

module.exports = personSchema;