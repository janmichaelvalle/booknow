import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"



export function EventDetails() {
    return (
    
    <Card>
  <CardHeader>
    <CardTitle>Event Details</CardTitle>
    <CardDescription>Tell us about your event</CardDescription>
    {/* <CardAction>Card Action</CardAction> */}
  </CardHeader>
  <CardContent>
    <p>Card Content</p>
  </CardContent>
  <CardFooter>
    <p>Card Footer</p>
  </CardFooter>
</Card>
    )
    
}