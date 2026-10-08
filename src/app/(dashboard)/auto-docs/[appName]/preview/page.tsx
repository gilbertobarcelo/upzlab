import React from 'react';
import PublicDocsLabClient from '../../../../docslab/[appName]/PublicDocsLabClient';

export default async function PreviewPage({ params }: { params: Promise<{ appName: string }> }) {
  const resolvedParams = await params;
  const decodedAppName = decodeURIComponent(resolvedParams.appName);

  // Reutiliza o Client de documentação pública, 
  // com uma flag ou apenas ignorando o bloqueio caso precisemos
  return <PublicDocsLabClient appName={decodedAppName} isPreview={true} />;
}
