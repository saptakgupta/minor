const SlotLegend = () => {
  const items = [
    { color: "bg-status-available", label: "Available" },
    { color: "bg-status-occupied", label: "Occupied" },
    { color: "bg-status-reserved", label: "Reserved" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-xl border border-border/50">
      <span className="text-sm font-medium text-muted-foreground">Legend:</span>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full ${item.color}`} />
          <span className="text-sm text-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default SlotLegend;
