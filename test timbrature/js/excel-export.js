// ========================================
// Excel Export Module
// Usa SheetJS (xlsx) per generare file Excel
// ========================================

const ExcelExport = {

    /**
     * Esporta report ore lavorate in Excel
     */
    async exportReport(reportData, startDate, endDate, filename) {
        try {
            // Verifica che SheetJS sia caricato
            if (typeof XLSX === 'undefined') {
                throw new Error('Libreria XLSX non caricata');
            }

            // Crea un nuovo workbook
            const wb = XLSX.utils.book_new();

            // Crea foglio riepilogo
            const summarySheet = this.createSummarySheet(reportData, startDate, endDate);
            XLSX.utils.book_append_sheet(wb, summarySheet, 'Riepilogo');

            // Crea foglio dettagliato
            const detailSheet = this.createDetailSheet(reportData, startDate, endDate);
            XLSX.utils.book_append_sheet(wb, detailSheet, 'Dettaglio');

            // Genera e scarica il file
            XLSX.writeFile(wb, `${filename}.xlsx`);

        } catch (error) {
            console.error('Errore export Excel:', error);
            throw error;
        }
    },

    /**
     * Converte ore decimali in formato HH:MM
     * Es: 6.5 -> "6:30", 8.75 -> "8:45"
     */
    decimalToHoursMinutes(decimalHours) {
        if (!decimalHours) return '0:00';

        const hours = Math.floor(decimalHours);
        const minutes = Math.round((decimalHours - hours) * 60);

        return `${hours}:${minutes.toString().padStart(2, '0')}`;
    },

    /**
     * Crea foglio riepilogo
     */
    createSummarySheet(reportData, startDate, endDate) {
        const data = [];

        // Intestazione
        data.push(['REPORT ORE LAVORATE']);
        data.push([`Periodo: ${formatDate(startDate)} - ${formatDate(endDate)}`]);
        data.push(['']);

        // Header tabella
        data.push(['Dipendente', 'Totale Ore', 'Numero Timbrature']);

        // Dati dipendenti
        let totalHours = 0;
        let totalEntries = 0;

        reportData.forEach(emp => {
            data.push([
                emp.employeeName,
                this.decimalToHoursMinutes(emp.totalHours),
                emp.entries.length
            ]);
            totalHours += emp.totalHours;
            totalEntries += emp.entries.length;
        });

        // Totali
        data.push(['']);
        data.push(['TOTALE', this.decimalToHoursMinutes(totalHours), totalEntries]);

        // Converti in foglio
        const ws = XLSX.utils.aoa_to_sheet(data);

        // Formattazione larghezza colonne
        ws['!cols'] = [
            { wch: 30 }, // Dipendente
            { wch: 15 }, // Totale Ore
            { wch: 20 }  // Numero Timbrature
        ];

        return ws;
    },

    /**
     * Crea foglio dettagliato
     */
    createDetailSheet(reportData, startDate, endDate) {
        const data = [];

        // Intestazione
        data.push(['DETTAGLIO TIMBRATURE']);
        data.push([`Periodo: ${formatDate(startDate)} - ${formatDate(endDate)}`]);
        data.push(['']);

        // Header tabella
        data.push(['Dipendente', 'Data', 'Entrata', 'Uscita', 'Ore Lavorate', 'Note']);

        // Dati per ogni dipendente
        let grandTotalHours = 0;
        reportData.forEach(emp => {
            emp.entries.forEach(entry => {
                const hours = entry.hours_worked ? parseFloat(entry.hours_worked) : 0;
                grandTotalHours += hours;

                data.push([
                    emp.employeeName,
                    formatDate(entry.entry_time),
                    formatTime(entry.entry_time),
                    entry.exit_time ? formatTime(entry.exit_time) : 'In corso',
                    entry.hours_worked ? this.decimalToHoursMinutes(entry.hours_worked) : '-',
                    entry.notes || ''
                ]);
            });
        });

        // Aggiungi riga di totale finale
        data.push(['']);
        data.push(['', '', '', 'TOTALE ORE', this.decimalToHoursMinutes(grandTotalHours), '']);

        // Converti in foglio
        const ws = XLSX.utils.aoa_to_sheet(data);

        // Formattazione larghezza colonne
        ws['!cols'] = [
            { wch: 25 }, // Dipendente
            { wch: 12 }, // Data
            { wch: 10 }, // Entrata
            { wch: 10 }, // Uscita
            { wch: 15 }, // Ore Lavorate
            { wch: 30 }  // Note
        ];

        return ws;
    }
};

// Export globale
window.ExcelExport = ExcelExport;
