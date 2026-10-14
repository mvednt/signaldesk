import { Icon } from "./ui";

function peopleSearchUrl(companyName: string, contactName?: string | null, companyLinkedin?: string | null): string {
  if (contactName) {
    return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${contactName} ${companyName}`)}`;
  }
  if (companyLinkedin) return `${companyLinkedin.replace(/\/+$/, "")}/people/`;
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`operations OR people ${companyName}`)}`;
}

/** Who to reach (person named in the trigger, from Gemini) + where (the
 *  company's verified handles, from Apollo) + a one-click LinkedIn search. */
export function ReachBox({
  companyName,
  contactName,
  contactTitle,
  companyLinkedin,
  companyWebsite,
  companyPhone,
  companyHq,
  companyHeadcount,
}: {
  companyName: string;
  contactName?: string | null;
  contactTitle?: string | null;
  companyLinkedin?: string | null;
  companyWebsite?: string | null;
  companyPhone?: string | null;
  companyHq?: string | null;
  companyHeadcount?: number | null;
}) {
  const hasCompany = companyLinkedin || companyWebsite || companyPhone || companyHq || companyHeadcount;
  if (!contactName && !hasCompany) return null;
  const search = peopleSearchUrl(companyName, contactName, companyLinkedin);

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-line bg-paper p-4">
      <span className="text-[11px] font-medium tracking-[0.08em] text-faint">WHO / WHERE TO REACH</span>

      {contactName ? (
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-human-soft text-human-ink">
            <Icon name="person" size={18} />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="text-[14.5px] font-semibold text-ink">{contactName}</span>
            {contactTitle && <span className="text-[12.5px] text-muted">{contactTitle}</span>}
          </div>
          <a
            href={search}
            target="_blank"
            rel="noopener noreferrer"
            className="sd-press ml-auto flex h-8 items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-surface px-3 text-[12.5px] font-medium no-underline hover:bg-track"
          >
            <Icon name="search" size={15} /> LinkedIn
          </a>
        </div>
      ) : (
        <p className="m-0 text-[13px] text-muted">No individual named in this trigger — start with the company&apos;s team.</p>
      )}

      {hasCompany && (
        <div className="flex flex-col gap-1.5 border-t border-line pt-2.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
            {companyHq && <span className="flex items-center gap-1"><Icon name="location_on" size={14} />{companyHq}</span>}
            {companyHeadcount ? <span className="flex items-center gap-1"><Icon name="group" size={14} />~{companyHeadcount.toLocaleString()} staff</span> : null}
            {companyPhone && <span className="flex items-center gap-1"><Icon name="call" size={14} />{companyPhone}</span>}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5 text-[13px]">
            {companyLinkedin && (
              <a href={companyLinkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-medium text-ember-dark no-underline hover:underline">
                <Icon name="business_center" size={15} /> Company page
              </a>
            )}
            {!contactName && (
              <a href={search} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-medium text-ember-dark no-underline hover:underline">
                <Icon name="search" size={15} /> Find the team
              </a>
            )}
            {companyWebsite && (
              <a href={companyWebsite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-medium text-ember-dark no-underline hover:underline">
                <Icon name="language" size={15} /> Website
              </a>
            )}
          </div>
          <span className="text-[10.5px] text-faint">Company data enriched via Apollo</span>
        </div>
      )}
    </div>
  );
}
