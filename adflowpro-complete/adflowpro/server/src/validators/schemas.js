import Joi from 'joi';

// ─── Generic validator factory ───────────────────────────────
export const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });
  if (error) {
    const messages = error.details.map(d => d.message);
    return res.status(422).json({ success: false, message: 'Validation failed', errors: messages });
  }
  req[property] = value;
  next();
};

// ─── Auth Schemas ────────────────────────────────────────────
export const registerSchema = Joi.object({
  name:     Joi.string().min(2).max(120).required(),
  email:    Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

// ─── Ad Schemas ──────────────────────────────────────────────
export const createAdSchema = Joi.object({
  title:       Joi.string().min(5).max(200).required(),
  description: Joi.string().min(10).max(5000).required(),
  price:       Joi.string().max(80).optional(),
  category_id: Joi.string().uuid().required(),
  city_id:     Joi.string().uuid().required(),
  media_urls:  Joi.array().items(Joi.string().uri()).max(5).optional(),
});

export const updateAdSchema = Joi.object({
  title:       Joi.string().min(5).max(200),
  description: Joi.string().min(10).max(5000),
  price:       Joi.string().max(80),
  category_id: Joi.string().uuid(),
  city_id:     Joi.string().uuid(),
  media_urls:  Joi.array().items(Joi.string().uri()).max(5),
}).min(1);

// ─── Payment Schema ──────────────────────────────────────────
export const paymentSchema = Joi.object({
  ad_id:           Joi.string().uuid().required(),
  package_id:      Joi.string().uuid().required(),
  method:          Joi.string().valid('EasyPaisa','JazzCash','Bank Transfer','Card').required(),
  transaction_ref: Joi.string().min(4).max(120).required(),
  sender_name:     Joi.string().max(120).optional(),
  screenshot_url:  Joi.string().uri().optional(),
});

// ─── Moderator Review Schema ─────────────────────────────────
export const reviewSchema = Joi.object({
  action: Joi.string().valid('approve','reject','flag').required(),
  note:   Joi.string().max(1000).optional(),
});

// ─── Admin Verify Payment Schema ─────────────────────────────
export const verifyPaymentSchema = Joi.object({
  action: Joi.string().valid('verify','reject').required(),
  note:   Joi.string().max(500).optional(),
});

// ─── Admin Publish Schema ────────────────────────────────────
export const publishAdSchema = Joi.object({
  action:     Joi.string().valid('publish','schedule','reject').required(),
  publish_at: Joi.when('action', {
    is:   'schedule',
    then: Joi.date().iso().greater('now').required(),
  }),
  note: Joi.string().max(500).optional(),
});
