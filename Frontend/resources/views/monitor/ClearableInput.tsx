import React, { useState, useCallback, CSSProperties, InputHTMLAttributes } from 'react';

// Inline CSS for the ClearableInput component
const clearableInputStyles = {
    wrapper: {
        position: 'relative',
        display: 'inline-block',
        width: '100%', // Ensure the wrapper takes the full width available
    } as CSSProperties,
    input: {
        paddingRight: '30px', // Make space for the clear button
        boxSizing: 'border-box', // Crucial to prevent padding from increasing overall width
    } as CSSProperties,
    clearButton: {
        position: 'absolute',
        right: '8px',
        top: '50%',
        transform: 'translateY(-50%)',
        backgroundColor: 'transparent',
        border: 'none',
        color: '#999',
        fontSize: '16px',
        cursor: 'pointer',
        padding: '0',
        lineHeight: '1',
        height: '16px',
        width: '16px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transition: 'color 0.2s ease',
    } as CSSProperties,
    clearButtonHover: {
        color: '#666',
    } as CSSProperties,
};

// Props interface for ClearableInput
interface ClearableInputProps extends InputHTMLAttributes<HTMLInputElement> {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClear: () => void; // Callback function when the clear button is clicked
    inputStyle?: CSSProperties; // Allows passing additional inline styles to the actual input element
}

const ClearableInput: React.FC<ClearableInputProps> = ({ value, onChange, onClear, inputStyle, ...props }) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleClearClick = useCallback(() => {
        onClear(); // Call the onClear function passed from the parent component
    }, [onClear]);

    return (
        <div style={clearableInputStyles.wrapper}>
            <input
                value={value}
                onChange={onChange}
                style={{ ...inputStyle, ...clearableInputStyles.input }} // Combine parent's style with component's own style
                {...props} // Pass any other standard input props (e.g., type, placeholder, disabled)
            />
            {value && ( // Only display the clear button if the input has a value
                <button
                    type="button" // Important: type="button" prevents form submission
                    style={{
                        ...clearableInputStyles.clearButton,
                        ...(isHovered ? clearableInputStyles.clearButtonHover : {}),
                    }}
                    onClick={handleClearClick}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    aria-label="Clear input" // Accessibility enhancement
                >
                    &times; {/* HTML entity for 'x' character */}
                </button>
            )}
        </div>
    );
};

export default ClearableInput;