import { useMemo } from 'react'
import { useFormContext, useFormState, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Stack } from '@chakra-ui/react'

import { FormField, LogicDto, MyInfoFormField } from '~shared/types'

import { ThemeColorScheme } from '~theme/foundations/colours'
import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'
import { FormFieldValues } from '~templates/Field'

import { getLogicUnitPreventingSubmit } from '~features/logic/utils'

interface PublicFormSubmitButtonProps {
  formFields: MyInfoFormField<FormField>[]
  formLogics: LogicDto[]
  colorTheme: string
}

/**
 * This component is split up so that input changes will not rerender the
 * entire FormFields component leading to terrible performance.
 */
export const PublicFormSubmitButton = ({
  formFields,
  formLogics,
  colorTheme,
}: PublicFormSubmitButtonProps): JSX.Element => {
  const { t } = useTranslation()

  const isMobile = useIsMobile()
  const { isSubmitting } = useFormState()
  const formInputs = useWatch<FormFieldValues>({})

  const preventSubmissionLogic = useMemo(() => {
    return getLogicUnitPreventingSubmit({
      formInputs,
      formFields,
      formLogics,
    })
  }, [formInputs, formFields, formLogics])

  return (
    <Stack px={{ base: '1rem', md: 0 }} pt="2.5rem" pb="4rem">
      <Button
        isFullWidth={isMobile}
        w="100%"
        colorScheme={`theme-${colorTheme}` as ThemeColorScheme}
        type="submit"
        isLoading={isSubmitting}
        isDisabled={!!preventSubmissionLogic}
        loadingText={t(
          'features.publicForm.components.FormFields.PublicFormSubmitButton.submitting',
        )}
      >
        {preventSubmissionLogic
          ? t(
              'features.publicForm.components.FormFields.PublicFormSubmitButton.submissionDisabled',
            )
          : t(
              'features.publicForm.components.FormFields.PublicFormSubmitButton.submitNow',
            )}
      </Button>
      {preventSubmissionLogic ? (
        <InlineMessage variant="warning">
          {preventSubmissionLogic.preventSubmitMessage}
        </InlineMessage>
      ) : null}
    </Stack>
  )
}
