const contacts = [
  { name: "Johnlory Amparo", role: "Developer" },
  { name: "Jake Cuyugan", role: "Technical Writer" },
  { name: "Joeven Secusana", role: "System Analyst" },
  { name: "Rosalie Paculanan", role: "Project Manager" },
  { name: "Gabriel Suarez", role: "Developer" },
];

function ContactsPage() {
  return (
    <div className="fixed inset-0 bg-background [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] overflow-hidden">
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-xl font-light text-foreground mb-1">
              Contacts
            </h1>
            <div className="w-8 h-px bg-muted-foreground/20 mx-auto"></div>
          </div>

          {/* Contacts */}
          <div className="space-y-4">
            {contacts.map((contact, i) => (
              <div key={i} className="group">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                  <span className="font-normal text-foreground">
                    {contact.name}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {contact.role}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-12">
            <div className="w-8 h-px bg-muted-foreground/20 mx-auto mb-2"></div>
            <p className="text-xs text-muted-foreground">
              {contacts.length} people
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactsPage;
