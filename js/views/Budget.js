function BudgetView() {
  const { trip } = Store.useStore();
  return (
    <Placeholder
      kicker="Budget"
      title={trip.name}
      subtitle="Comptes partagés"
      hint="3 onglets : Aperçu (KPIs + camembert), Dépenses (liste éditable), Équilibre (remboursements à faire)."
    />
  );
}
window.BudgetView = BudgetView;
