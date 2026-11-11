import { cn } from '@/lib/utils';

type MaintenanceNoticeProps = {
  message: string;
  endsAt: string | null;
  infoUrl: string | null;
  fullPage?: boolean;
};

export function MaintenanceNotice({
  message,
  endsAt,
  infoUrl,
  fullPage = false,
}: MaintenanceNoticeProps) {
  const Heading = fullPage ? 'h1' : 'h2';

  return (
    <section
      aria-label="メンテナンスのお知らせ"
      className={cn(
        'border-border bg-background text-foreground border-b px-6 py-5',
        fullPage && 'grid min-h-svh content-center border-0',
      )}
      data-nosnippet=""
      role="status"
    >
      <div className="mx-auto w-full max-w-3xl space-y-2">
        <Heading className="text-lg font-semibold">メンテナンスのお知らせ</Heading>
        <p>{message}</p>
        <p className="text-muted-foreground text-sm">
          {fullPage
            ? 'サービスを一時停止しています。時間をおいて再度アクセスしてください。'
            : '閲覧以外の操作（ログイン・ログアウトを含む）を一時停止しています。'}
        </p>
        <p className="text-sm">
          {endsAt ? (
            <>
              復旧予定：
              <time dateTime={endsAt}>
                {new Date(endsAt).toLocaleString('ja-JP', { timeZoneName: 'short' })}
              </time>
            </>
          ) : (
            '復旧予定は確認中です。状況が分かり次第お知らせします。'
          )}
        </p>
        {infoUrl && (
          <a className="text-sm underline underline-offset-4" href={infoUrl}>
            状況・お問い合わせ
          </a>
        )}
      </div>
    </section>
  );
}
