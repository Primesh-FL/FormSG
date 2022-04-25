import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'

import { ITwilioSmsWebhookBody } from 'src/types/twilio'

import { statsdClient } from '../../config/datadog-statsd-client'
import { createLoggerWithLabel } from '../../config/logger'
import { ControllerHandler } from '../core/core.types'

const logger = createLoggerWithLabel(module)
const ddClient = statsdClient.childClient({
  prefix: 'vendor.twilio.',
})

/**
 * Middleware which validates that a request came from Twilio Webhook
 * by checking the presence of X-Twilio-Sgnature in request header and
 * sms delivery status request body parameters
 */
const validateTwilioWebhook = celebrate({
  [Segments.HEADERS]: Joi.object({
    'x-twilio-signature': Joi.string().required(),
  }).unknown(),
  [Segments.BODY]: Joi.object()
    .keys({
      SmsSid: Joi.string().required(),
      SmsStatus: Joi.string().required(),
      MessageStatus: Joi.string().required(),
      To: Joi.string().required(),
      MessageSid: Joi.string().required(),
      AccountSid: Joi.string().required(),
      From: Joi.string().required(),
      ApiVersion: Joi.string().required(),
      ErrorCode: Joi.number(), //Unable to find any official documentation stating the ErrorCode type but should be a number
      ErrorMessage: Joi.string(),
    })
    .unknown(),
})

/**
 * Logs all incoming Webhook requests from Twilio in AWS
 *
 * @param req Express request object
 * @param res - Express response object
 */
export const twilioSmsUpdates: ControllerHandler<
  unknown,
  never,
  ITwilioSmsWebhookBody
> = async (req, res) => {
  /**
   * Currently, it seems like the status are provided as string values, theres
   * no other documentation stating the properties and values in the Node SDK
   *
   * Example: https://www.twilio.com/docs/usage/webhooks/sms-webhooks.
   */

  // should we add
  const tags = {
    accountsid: req.body.AccountSid,
    smsstatus: req.body.SmsStatus,
    errorcode: '0',
  }

  if (req.body.ErrorCode || req.body.ErrorMessage) {
    tags.errorcode = `${req.body.ErrorCode}`
    logger.error({
      message: 'Error occurred when attempting to send SMS on twillio',
      meta: {
        action: 'twilioSmsUpdates',
        body: req.body,
      },
    })
  } else {
    logger.info({
      message: 'Sms Delivery update',
      meta: {
        action: 'twilioSmsUpdates',
        body: req.body,
      },
    })
  }

  ddClient.increment('sms.update', 1, 1, tags)

  return res.sendStatus(StatusCodes.OK)
}

export const handleTwilioSmsUpdates = [validateTwilioWebhook, twilioSmsUpdates]
