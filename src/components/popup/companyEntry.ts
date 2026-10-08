// The company a booking is invoiced to (CompanyChoice). Stored on the booking
// as given; the invoice function trims it and puts it on the invoice.
export interface CompanyEntry {
  name: string;
  regNumber: string;
  address: string;
  // Only for companies registered for VAT.
  vatNumber: string;
}

export const emptyCompany: CompanyEntry = { name: '', regNumber: '', address: '', vatNumber: '' };

/** What the booking stores: nothing unless the invoice is for a company. */
export const companyForBooking = (company: CompanyEntry | null) =>
  company
    ? {
        name: company.name.trim(),
        regNumber: company.regNumber.trim(),
        address: company.address.trim(),
        ...(company.vatNumber.trim() ? { vatNumber: company.vatNumber.trim() } : {}),
      }
    : null;
