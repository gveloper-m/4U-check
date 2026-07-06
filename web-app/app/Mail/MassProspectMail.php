<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MassProspectMail extends Mailable
{
    use Queueable, SerializesModels;

    private static array $STRINGS = [
        'en' => [
            'subject'        => 'We audited {domain} — health score: {score}/100',
            'greeting'       => 'Hi there,',
            'intro'          => 'We ran a free automated audit on <strong>{website}</strong> and wanted to share what we found.',
            'score_label'    => 'Overall Health Score',
            'issues_title'   => 'Top issues detected',
            'report_label'   => 'View your full free report',
            'features_title' => '4uTest monitors your website for',
            'features'       => ['SEO & meta tags', 'Security & HTTPS headers', 'Core Web Vitals & performance', 'Broken links & images', 'E-commerce catalog issues', 'Marketing pixel health', 'Accessibility (WCAG 2.1)'],
            'cta'            => 'Start free — monitor {domain}',
            'footer'         => 'You received this email because we ran a complimentary audit on your website. To stop receiving these, simply reply with "unsubscribe".',
        ],
        'el' => [
            'subject'        => 'Ελέγξαμε το {domain} — βαθμολογία: {score}/100',
            'greeting'       => 'Γεια σας,',
            'intro'          => 'Εκτελέσαμε έναν δωρεάν αυτόματο έλεγχο στο <strong>{website}</strong> και θέλαμε να μοιραστούμε τα αποτελέσματα.',
            'score_label'    => 'Συνολική Βαθμολογία',
            'issues_title'   => 'Κύρια προβλήματα που εντοπίστηκαν',
            'report_label'   => 'Δείτε την πλήρη δωρεάν αναφορά',
            'features_title' => 'Το 4uTest παρακολουθεί την ιστοσελίδα σας για',
            'features'       => ['SEO & meta tags', 'Ασφάλεια & HTTPS headers', 'Core Web Vitals & απόδοση', 'Σπασμένοι σύνδεσμοι & εικόνες', 'Προβλήματα e-commerce', 'Marketing pixels', 'Προσβασιμότητα (WCAG 2.1)'],
            'cta'            => 'Ξεκινήστε δωρεάν — παρακολουθήστε το {domain}',
            'footer'         => 'Λάβατε αυτό το email επειδή εκτελέσαμε έναν δωρεάν έλεγχο στην ιστοσελίδα σας. Για διαγραφή, απαντήστε με "unsubscribe".',
        ],
        'de' => [
            'subject'        => 'Wir haben {domain} geprüft — Score: {score}/100',
            'greeting'       => 'Hallo,',
            'intro'          => 'Wir haben einen kostenlosen automatischen Audit für <strong>{website}</strong> durchgeführt und möchten die Ergebnisse mit Ihnen teilen.',
            'score_label'    => 'Gesamtbewertung',
            'issues_title'   => 'Wichtigste gefundene Probleme',
            'report_label'   => 'Vollständigen kostenlosen Bericht ansehen',
            'features_title' => '4uTest überwacht Ihre Website auf',
            'features'       => ['SEO & Meta-Tags', 'Sicherheit & HTTPS-Header', 'Core Web Vitals & Performance', 'Defekte Links & Bilder', 'E-Commerce-Katalogprobleme', 'Marketing-Pixel-Gesundheit', 'Barrierefreiheit (WCAG 2.1)'],
            'cta'            => 'Kostenlos starten — {domain} überwachen',
            'footer'         => 'Sie erhalten diese E-Mail, weil wir einen kostenlosen Audit Ihrer Website durchgeführt haben. Antworten Sie mit "unsubscribe", um keine weiteren E-Mails zu erhalten.',
        ],
        'fr' => [
            'subject'        => 'Nous avons audité {domain} — score: {score}/100',
            'greeting'       => 'Bonjour,',
            'intro'          => 'Nous avons effectué un audit automatique gratuit sur <strong>{website}</strong> et souhaitons vous partager les résultats.',
            'score_label'    => 'Score de santé global',
            'issues_title'   => 'Principaux problèmes détectés',
            'report_label'   => 'Voir le rapport complet gratuit',
            'features_title' => '4uTest surveille votre site pour',
            'features'       => ['SEO & balises meta', 'Sécurité & en-têtes HTTPS', 'Core Web Vitals & performance', 'Liens & images cassés', 'Problèmes de catalogue e-commerce', 'Santé des pixels marketing', 'Accessibilité (WCAG 2.1)'],
            'cta'            => 'Démarrer gratuitement — surveiller {domain}',
            'footer'         => 'Vous recevez cet e-mail car nous avons effectué un audit gratuit de votre site. Pour vous désabonner, répondez simplement avec "unsubscribe".',
        ],
        'es' => [
            'subject'        => 'Auditamos {domain} — puntuación: {score}/100',
            'greeting'       => 'Hola,',
            'intro'          => 'Realizamos una auditoría automática gratuita en <strong>{website}</strong> y queremos compartir los resultados.',
            'score_label'    => 'Puntuación de salud general',
            'issues_title'   => 'Principales problemas detectados',
            'report_label'   => 'Ver el informe completo gratuito',
            'features_title' => '4uTest monitoriza tu web en busca de',
            'features'       => ['SEO & etiquetas meta', 'Seguridad & cabeceras HTTPS', 'Core Web Vitals & rendimiento', 'Enlaces e imágenes rotos', 'Problemas de catálogo e-commerce', 'Estado de píxeles de marketing', 'Accesibilidad (WCAG 2.1)'],
            'cta'            => 'Comenzar gratis — monitorizar {domain}',
            'footer'         => 'Recibes este correo porque realizamos una auditoría gratuita de tu sitio web. Para darte de baja, responde con "unsubscribe".',
        ],
        'nl' => [
            'subject'        => 'We hebben {domain} gecontroleerd — score: {score}/100',
            'greeting'       => 'Hallo,',
            'intro'          => 'We hebben een gratis automatische audit uitgevoerd op <strong>{website}</strong> en willen de resultaten met u delen.',
            'score_label'    => 'Algemene gezondheidsscore',
            'issues_title'   => 'Belangrijkste gevonden problemen',
            'report_label'   => 'Bekijk het volledige gratis rapport',
            'features_title' => '4uTest bewaakt uw website op',
            'features'       => ['SEO & meta-tags', 'Beveiliging & HTTPS-headers', 'Core Web Vitals & prestaties', 'Gebroken links & afbeeldingen', 'E-commerce catalogusproblemen', 'Marketing pixel gezondheid', 'Toegankelijkheid (WCAG 2.1)'],
            'cta'            => 'Gratis starten — {domain} bewaken',
            'footer'         => 'U ontvangt deze e-mail omdat we een gratis audit van uw website hebben uitgevoerd. Antwoord met "unsubscribe" om u af te melden.',
        ],
        'cs' => [
            'subject'        => 'Auditovali jsme {domain} — skóre: {score}/100',
            'greeting'       => 'Dobrý den,',
            'intro'          => 'Provedli jsme bezplatný automatický audit webu <strong>{website}</strong> a rádi bychom se s vámi podělili o výsledky.',
            'score_label'    => 'Celkové skóre zdraví',
            'issues_title'   => 'Hlavní zjištěné problémy',
            'report_label'   => 'Zobrazit úplnou bezplatnou zprávu',
            'features_title' => '4uTest monitoruje váš web na',
            'features'       => ['SEO & meta tagy', 'Zabezpečení & HTTPS hlavičky', 'Core Web Vitals & výkon', 'Nefunkční odkazy & obrázky', 'Problémy s e-commerce katalogem', 'Stav marketingových pixelů', 'Přístupnost (WCAG 2.1)'],
            'cta'            => 'Začněte zdarma — sledovat {domain}',
            'footer'         => 'Tento e-mail jste obdrželi, protože jsme provedli bezplatný audit vašeho webu. Pro odhlášení odpovězte slovem "unsubscribe".',
        ],
    ];

    public function __construct(
        public readonly string $website,
        public readonly int    $score,
        public readonly array  $issues,
        public readonly string $shareUrl,
        public readonly string $language = 'en',
    ) {}

    public function envelope(): Envelope
    {
        $strings = $this->strings();
        $domain  = parse_url($this->website, PHP_URL_HOST) ?: $this->website;
        $subject = strtr($strings['subject'], ['{domain}' => $domain, '{score}' => $this->score]);
        return new Envelope(
            from:    new \Illuminate\Mail\Mailables\Address('4utestservice@gmail.com', '4uTest'),
            subject: $subject,
        );
    }

    public function content(): Content
    {
        $strings = $this->strings();
        $domain  = parse_url($this->website, PHP_URL_HOST) ?: $this->website;

        $replace = ['{website}' => $this->website, '{domain}' => $domain, '{score}' => $this->score];

        return new Content(
            view: 'mail.mass-prospect',
            with: [
                'greeting'       => $strings['greeting'],
                'intro'          => strtr($strings['intro'], $replace),
                'scoreLabel'     => $strings['score_label'],
                'score'          => $this->score,
                'issuesTitle'    => $strings['issues_title'],
                'issues'         => $this->issues,
                'reportLabel'    => $strings['report_label'],
                'shareUrl'       => $this->shareUrl,
                'featuresTitle'  => $strings['features_title'],
                'features'       => $strings['features'],
                'ctaText'        => strtr($strings['cta'], $replace),
                'footer'         => $strings['footer'],
                'appUrl'         => config('app.url'),
            ],
        );
    }

    private function strings(): array
    {
        return self::$STRINGS[$this->language] ?? self::$STRINGS['en'];
    }
}
