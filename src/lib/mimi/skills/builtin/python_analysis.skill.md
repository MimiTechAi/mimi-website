---
name: python_analysis
description: "Executes Python code in a browser-based sandbox. Use this for data analysis, complex calculations, simulations, and visualizations."
capabilities: ["data-analysis", "python", "visualization", "calculation", "math"]
enabled: true
---

# INSTRUCTIONS

When the user asks for calculations, plots, or data processing:

1. **Write Python Code**: Enclose code in \`\`\`python ... \`\`\` blocks.
2. **Use Libraries**: `numpy`, `pandas`, `matplotlib.pyplot` are pre-installed.
3. **Visualize**: Use `matplotlib` to create charts. End with `plt.show()`.
4. **Be Direct**: Do not explain *how* to write the code unless asked. just write it.

## Example

User: "Plot a sine wave."

\`\`\`python
import numpy as np
import matplotlib.pyplot as plt

x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.plot(x, y)
plt.title('Sine Wave')
plt.show()
\`\`\`
