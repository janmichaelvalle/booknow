import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Mail, Phone, User } from "lucide-react"

type CustomerDetailsProps = {
  form: any
}

export function CustomerDetails({ form }: CustomerDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Details</CardTitle>
        <CardDescription>
          Tell us who we should contact for this reservation
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <form.Field
          name="customerName"
          children={(field: any) => (
            <Field data-invalid={!field.state.meta.isValid && field.state.meta.isTouched}>
              <FieldLabel htmlFor={field.name} className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name
              </FieldLabel>

              <Input
                id={field.name}
                placeholder="Enter full name"
                value={field.state.value ?? ""}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />

              {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                <FieldError errors={field.state.meta.errors} />
              )}
            </Field>
          )}
        />

        <form.Field
          name="customerEmail"
          children={(field: any) => (
            <Field data-invalid={!field.state.meta.isValid && field.state.meta.isTouched}>
              <FieldLabel htmlFor={field.name} className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </FieldLabel>

              <Input
                id={field.name}
                type="email"
                placeholder="Enter email address"
                value={field.state.value ?? ""}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />

              {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                <FieldError errors={field.state.meta.errors} />
              )}
            </Field>
          )}
        />

        <form.Field
          name="customerPhone"
          children={(field: any) => (
            <Field data-invalid={!field.state.meta.isValid && field.state.meta.isTouched}>
              <FieldLabel htmlFor={field.name} className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </FieldLabel>

              <Input
                id={field.name}
                type="tel"
                placeholder="Enter phone number"
                value={field.state.value ?? ""}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />

              {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                <FieldError errors={field.state.meta.errors} />
              )}
            </Field>
          )}
        />
      </CardContent>
    </Card>
  )
}