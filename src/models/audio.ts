import { categories, categoriesTypes } from "#/utils/audio_category";
import { ObjectId, Schema, model, Model, models } from "mongoose";

export interface AudioDocument{
    title: string;
    about: string;
    owner: ObjectId;
    file: {
        url: string;
        publicId: string;
    }
    poster?: {
        url: string;
        publicId: string;
    }
    likes: ObjectId[];
    category: categoriesTypes
}

const audioSchema = new Schema<AudioDocument>({
    title: {
        type: String,
        required: true,
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    about:{
        type: String,
        required: true,
    },
    file:{
        type: Object,
        url: String,
        publicId: String,
        required: true
    },
    poster:{
        type: Object,
        url: String,
        publicId: String
    },
    likes:[{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    category:{
        type: String,
        enum: categories,
        default: "Others"
    }
}, {
    timestamps: true
})

const Audio = models.Audio || model("Audio", audioSchema)
export default Audio as Model<AudioDocument>;
