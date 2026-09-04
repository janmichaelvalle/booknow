type BusinessHeaderProps = {
  logoUrl: string
  businessName: string
  description: string
}

export function BusinessHeader({
  logoUrl,
  businessName,
  description,
}: BusinessHeaderProps) {
  return (
    <div className="flex items-center gap-4 px-6 py-5">
      <img
        src={logoUrl}
        alt={`${businessName} logo`}
        className="h-30 w-30 shrink-0 rounded-full border-2 border-primary object-cover"
      />

      <div className="min-w-0">
        <h1 className="text-xl font-bold">
          {businessName}
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}