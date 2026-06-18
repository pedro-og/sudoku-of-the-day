import { useTranslation } from 'react-i18next';
import css from './SeoContent.module.css';

export function SeoContent() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.slice(0, 2) || 'en';

  return (
    <section className={css.seoSection} aria-label="About Sudoku of the Day">
      <div className={css.inner}>

        <article className={css.block}>
          <h2 className={css.h2}>{t('seo.howToPlayTitle')}</h2>
          <ol className={css.orderedList}>
            <li>{t('seo.howToPlay1')}</li>
            <li>{t('seo.howToPlay2')}</li>
            <li>{t('seo.howToPlay3')}</li>
            <li>{t('seo.howToPlay4')}</li>
            <li>{t('seo.howToPlay5')}</li>
          </ol>
        </article>

        <article className={css.block}>
          <h2 className={css.h2}>{t('seo.whatIsDailyTitle')}</h2>
          <p className={css.p}>{t('seo.whatIsDailyBody')}</p>
        </article>

        <article className={css.block}>
          <h2 className={css.h2}>{t('seo.rulesTitle')}</h2>
          <ul className={css.list}>
            <li>{t('seo.rules1')}</li>
            <li>{t('seo.rules2')}</li>
            <li>{t('seo.rules3')}</li>
            <li>{t('seo.rules4')}</li>
          </ul>
        </article>

        <article className={css.block}>
          <h2 className={css.h2}>{t('seo.faqTitle')}</h2>
          <dl className={css.faq}>
            <dt className={css.dt}>{t('seo.faq1q')}</dt>
            <dd className={css.dd}>{t('seo.faq1a')}</dd>
            <dt className={css.dt}>{t('seo.faq2q')}</dt>
            <dd className={css.dd}>{t('seo.faq2a')}</dd>
            <dt className={css.dt}>{t('seo.faq3q')}</dt>
            <dd className={css.dd}>{t('seo.faq3a')}</dd>
            <dt className={css.dt}>{t('seo.faq4q')}</dt>
            <dd className={css.dd}>{t('seo.faq4a')}</dd>
          </dl>
        </article>

        {lang === 'en' && (
          <article className={css.block}>
            <h2 className={css.h2}>Available in Multiple Languages</h2>
            <p className={css.p}>
              Play today's Sudoku puzzle in your preferred language. Sudoku of the Day is available in English, Portuguese (<span lang="pt">Português</span>), Spanish (<span lang="es">Español</span>), German (<span lang="de">Deutsch</span>), French (<span lang="fr">Français</span>), Japanese (<span lang="ja">日本語</span>), Chinese (<span lang="zh">中文</span>), and Turkish (<span lang="tr">Türkçe</span>).
            </p>
          </article>
        )}

        <article className={css.block}>
          <h2 className={css.h2}>{t('seo.tipsTitle')}</h2>
          <ul className={css.list}>
            <li>{t('seo.tip1')}</li>
            <li>{t('seo.tip2')}</li>
            <li>{t('seo.tip3')}</li>
            <li>{t('seo.tip4')}</li>
          </ul>
        </article>

      </div>
    </section>
  );
}
