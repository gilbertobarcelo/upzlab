# UpzLab Android SDK — configuração por app e check-in

## Fluxo de configuração

Use `/sdk` e as rotas públicas `/sdk/integracao`, `/sdk/integracao/react-native`, `/sdk/integracao/capacitor`, `/sdk/integracao/kotlin` e `/sdk/api` para entender a integração. Os botões de download encaminham para cadastro; o SDK não é baixado diretamente pela documentação pública.

Após criar e verificar a conta, cadastre o app em `/apps/novo`, incluindo nome, Package ID e versão. O cadastro leva ao Lab Studio em `/studio/{id}/sdk`, que carrega esses dados diretamente do app registrado e os usa no trecho de integração; não é necessário preencher o Package ID novamente. O dono escolhe Kotlin, React Native ou Capacitor e baixa o SDK. O download é autorizado no backend e disponível apenas ao dono do app. O monitoramento de atividade fica em `/sdk/monitoramento`.

React Native e aplicações React/Next compatíveis com exportação estática e empacotadas via Capacitor compartilham o SDK TypeScript `src/lib/upzlab-sdk.ts`; conecte a abertura e o retorno ao primeiro plano (`AppState` ou `@capacitor/app`). Um site aberto apenas no navegador não monitora o ciclo de vida de um app Android. Recursos server-side do Next.js não são incluídos em um pacote estático. Para Android nativo sem WebView, use o SDK Kotlin `src/lib/upzlab-sdk.android.kt`.

O identificador `app_id` usado pelo SDK é o Package ID cadastrado, e `app_version` vem da versão do app registrada. O check-in deriva o desenvolvedor do JWT UpzLab atual da pessoa que está testando. O desenvolvedor precisa estar inscrito no app na comunidade; não inclua tokens fixos nem credenciais do dono no APK. O host da API é configurado pela implantação; o código do Lab Studio usa `NEXT_PUBLIC_API_URL` e não presume um domínio de produção.

## Atividade e recompensas

O SDK registra a entrada do app Android em primeiro plano. A atividade é única por desenvolvedor, app e dia local; novas aberturas do mesmo app no dia atual atualizam `last_seen_at`, sem criar sessões individuais. A tabela `dev_sdk_app_checkins` armazena essa atividade.

Os UpzPoints continuam limitados a uma recompensa por desenvolvedor e dia local, mesmo que a pessoa abra mais de um app integrado. O monitoramento lista apps do próprio desenvolvedor e apps em que ele está inscrito, e mostra a atividade separada para cada Package ID. O histórico exibido cobre os últimos sete dias, sem ser um histórico completo de sessões.

## API

Todas as rotas SDK exigem o JWT da sessão UpzLab no cabeçalho `Authorization`. O `dev_profile_id` é obtido da sessão no servidor e não deve ser enviado pelo cliente.

- `POST /api/upzlab/sdk/checkin` registra a abertura Android.
- `GET /api/upzlab/sdk/checkin/status?app_id=com.suaempresa.app&timezone=America/Sao_Paulo` consulta o status e o histórico daquele app.
- `GET /api/upzlab/sdk/checkin/compliance` retorna o status resumido.
- `GET /api/upzlab/sdk/apps` lista os apps próprios e aqueles em que o desenvolvedor está inscrito.

O POST recebe `app_id` (Package ID), `platform` (`android`), `session_id`, `timezone` IANA e `app_version` opcional. A versão é aceita para compatibilidade, mas ainda não é persistida. A unicidade da atividade é por perfil, app e dia; a recompensa continua única por perfil e dia local.

## Instalação Kotlin

O arquivo `src/lib/upzlab-sdk.android.kt` contém a classe `UpzLabSdk` e é baixado pelo dono do app na configuração SDK do Lab Studio. Não é necessário adicionar dependência Gradle externa: usa APIs do Android e `org.json` da plataforma.

Adicione a permissão no `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

Configure sua implementação de `Application` e conecte o provedor real de sessão do seu app:

```kotlin
class UpzLabApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        UpzLabSdk(
            application = this,
            appId = "com.suaempresa.app",
            apiBaseUrl = "https://HOST_CONFIGURADO/api/upzlab",
            accessTokenProvider = {
                // Substitua pelo leitor do JWT de sessão do seu app.
                authRepository.getAccessToken()
            },
            appVersion = BuildConfig.VERSION_NAME,
        ).startTracking()
    }
}
```

Registre a classe no elemento `<application>` do manifest. Use o código gerado no Studio para preencher o Package ID e o endpoint completo da implantação, incluindo `/api/upzlab`; o host depende da implantação e não é presumido nesta documentação. Não coloque tokens fixos no código-fonte. O callback `onError` recebe falhas de rede e de autenticação.

## Instalação TypeScript para apps Android JavaScript

Baixe o cliente TypeScript na configuração autenticada do Lab Studio e adicione-o ao projeto. O SDK usa `fetch` e não depende de APIs de DOM para enviar eventos. Em React Native, conecte `trackOpen()` aos eventos `AppState`; em um app Capacitor, instale `@capacitor/app`, sincronize o projeto Android e use esse plugin para detectar retorno ao primeiro plano. A página pública `/sdk` oferece guias explicativos; os snippets preenchidos por app ficam no Studio.

Para Capacitor, configure o backend para aceitar a origem real do WebView na variável `UPZLAB_ALLOWED_ORIGINS` se não for `https://localhost` ou `http://localhost`. Apps React Native fazem chamadas nativas e normalmente não estão sujeitos à política CORS do navegador.

O check-in credita pontos no máximo uma vez por perfil/dia, mesmo quando o SDK registra várias aberturas ou mais de um app.

## Lembretes

O job `backend/app/jobs/daily_checkin_reminders.py` executa o processamento de lembretes. Agende-o a cada minuto para chamar `process_daily_reminders`; o job só processa perfis a partir da hora de lembrete e limita novas tentativas de e-mail a uma por hora. `DAILY_CHECKIN_REMINDER_HOUR`, `DAILY_CHECKIN_DEADLINE_HOUR` e `DAILY_CHECKIN_DEFAULT_TIMEZONE` configuram a janela padrão. E-mail requer `SMTP_HOST` e `SMTP_FROM` e, opcionalmente, `SMTP_PORT`, `SMTP_USER` e `SMTP_PASSWORD`.

O job deve ser executado com uma sessão SQLAlchemy válida e fechado pelo processo agendador ao terminar. Sem a configuração de SMTP, o alerta interno continua disponível e a falha do envio fica registrada no alerta.
