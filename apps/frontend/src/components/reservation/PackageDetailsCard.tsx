
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"




type EventDetailsCardProps = {
    packagePrice: number,
    selectedPackage: string


}


export function PackageDetailsCard({ packagePrice, selectedPackage }: EventDetailsCardProps) {


    return (
        <>
        <Card>
                <CardHeader>
                    <CardTitle>Package Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Package: {selectedPackage}</p>
                </CardContent>
                <CardContent>
                    <p>Price: {packagePrice}</p>
                </CardContent>
                <CardContent>
             
                </CardContent>
            
            </Card>
        </>
    )
}