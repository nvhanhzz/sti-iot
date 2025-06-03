import React from 'react';

interface ChildProps {
    mode: string;
}

const FooterLayout: React.FC<ChildProps> = ({ mode }) => {
    return (
        <>
            <footer className={`main-footer ${mode}-mode`}>
                <strong>Copyright &copy; 2025-2025 <a href="https://adminlte.io">STI VIỆT NAM</a>.</strong>
            </footer>
        </>
    );
};

export default FooterLayout;