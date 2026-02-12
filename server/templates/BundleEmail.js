import React from 'react';
import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components';

export const BundleEmail = ({ title, pdfUrl, userEmail }) => {
    return React.createElement(
        Html,
        null,
        React.createElement(Head, null),
        React.createElement(Preview, null, `Seu relatório "${title}" está pronto`),
        React.createElement(
            Body,
            { style: main },
            React.createElement(
                Container,
                { style: container },
                React.createElement(
                    Section,
                    { style: header },
                    React.createElement(Heading, { style: h1 }, "cloudpilot")
                ),
                React.createElement(
                    Section,
                    { style: section },
                    React.createElement(Text, { style: text }, `Olá,`),
                    React.createElement(
                        Text,
                        { style: text },
                        `Seu relatório personalizado `,
                        React.createElement("strong", null, title),
                        ` foi gerado com sucesso pelo AI Studio.`
                    ),
                    React.createElement(
                        Section,
                        { style: btnContainer },
                        React.createElement(
                            Button,
                            { pX: 12, pY: 12, style: button, href: pdfUrl },
                            "Visualizar PDF"
                        )
                    ),
                    React.createElement(
                        Text,
                        { style: text },
                        `Ou copie e cole este link no seu navegador:`,
                        React.createElement("br", null),
                        React.createElement(
                            Link,
                            { href: pdfUrl, style: link },
                            pdfUrl
                        )
                    ),
                    React.createElement(Hr, { style: hr }),
                    React.createElement(
                        Text,
                        { style: footer },
                        "Este é um e-mail automático do programa CloudPilot AI Study."
                    )
                )
            )
        )
    );
};

const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
};

const header = {
    padding: '0 48px',
};

const section = {
    padding: '0 48px',
};

const h1 = {
    color: '#1e3a8a',
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'left',
    margin: '30px 0',
};

const text = {
    color: '#333',
    fontSize: '16px',
    lineHeight: '26px',
};

const btnContainer = {
    textAlign: 'center',
    margin: '32px 0',
};

const button = {
    backgroundColor: '#2563eb',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'block',
    width: '200px',
    margin: '0 auto',
};

const link = {
    color: '#2563eb',
    fontSize: '14px',
};

const hr = {
    borderColor: '#e6ebf1',
    margin: '20px 0',
};

const footer = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '16px',
};
